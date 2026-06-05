import os
import queue
import threading
import json
import uuid
from flask import Flask, request, send_file, send_from_directory, Response, jsonify
import map_fetcher
from io import BytesIO


app = Flask(__name__)

@app.route("/poster", methods=["GET"])
def get_poster():
    location = request.args.get('location')
    distance = int(request.args.get('distance'))
    fg_color = request.args.get("fg_color", "#000000")
    bg_color = request.args.get("bg_color", "#FFFFFF")
    
    image, coords = map_fetcher.make_poster(location=location, range=distance, bg_color_hex=bg_color, fg_color_hex=fg_color)
    img_io = BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')


@app.route("/poster/generate", methods=["GET"])
def generate_poster():
    location = request.args.get('location')
    distance_str = request.args.get('distance')
    fg_color = request.args.get("fg_color", "#000000")
    bg_color = request.args.get("bg_color", "#FFFFFF")

    def event_stream():
        if not location:
            yield f"data: {json.dumps({'status': 'error', 'message': 'Location parameter is required'})}\n\n"
            return
        
        try:
            distance = int(distance_str)
        except (TypeError, ValueError):
            yield f"data: {json.dumps({'status': 'error', 'message': 'Distance parameter must be an integer'})}\n\n"
            return

        q = queue.Queue()

        def callback(stage_name, payload=None):
            q.put((stage_name, payload))

        def worker():
            try:
                image, coords = map_fetcher.make_poster(
                    location=location,
                    range=distance,
                    bg_color_hex=bg_color,
                    fg_color_hex=fg_color,
                    callback=callback
                )

                
                # Save the image to cache
                cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
                os.makedirs(cache_dir, exist_ok=True)
                
                filename = f"{uuid.uuid4()}.png"
                filepath = os.path.join(cache_dir, filename)
                image.save(filepath, 'PNG')
                
                # Signal done
                callback("done", {
                    "image_url": f"/poster/cache/{filename}",
                    "coords": coords
                })
            except Exception as e:
                callback("error", {"message": str(e)})

        # Start background worker thread
        t = threading.Thread(target=worker, daemon=True)
        t.start()

        # Stream the status updates back to the client
        while True:
            status, payload = q.get()
            data = {"status": status}
            if payload:
                data.update(payload)
            yield f"data: {json.dumps(data)}\n\n"
            
            if status in ["done", "error"]:
                break

    response = Response(event_stream(), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    return response


@app.route("/poster/cache/<filename>", methods=["GET"])
def serve_cached_poster(filename):
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
    abs_cache_dir = os.path.abspath(cache_dir)
    requested_path = os.path.abspath(os.path.join(abs_cache_dir, filename))
    
    if not requested_path.startswith(abs_cache_dir + os.path.sep):
        return "Unauthorized", 401
        
    return send_from_directory(cache_dir, filename)


@app.route("/poster_logic.js", methods=['GET'])
def get_poster_logic():
    return send_file("../frontend/poster_logic.js", mimetype="text/js")

@app.route("/style.css", methods=['GET'])
def get_stylesheet():
    return send_file("../frontend/style.css", mimetype="text/css")

@app.route("/", methods=["GET"])
def get_home():
    return send_file("../frontend/index.html", mimetype='text/html')

if __name__ == '__main__':
    if "PORT" not in os.environ:
        raise ValueError("PORT environment variable must be set.")
    port = int(os.environ["PORT"])
    app.run(debug=True, host="0.0.0.0", port=port)