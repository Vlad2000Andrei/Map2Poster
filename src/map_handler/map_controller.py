import os
from flask import Flask, request, send_file
import map_fetcher
from io import BytesIO


app = Flask(__name__)

@app.route("/poster", methods=["GET"])
def get_poster():
    location = request.args.get('location')
    distance = int(request.args.get('distance'))
    fg_color = request.args.get("fg_color", "#000000")
    bg_color = request.args.get("bg_color", "#FFFFFF")
    
    image = map_fetcher.make_poster(location=location, range=distance, bg_color_hex=bg_color, fg_color_hex=fg_color)
    img_io = BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')

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