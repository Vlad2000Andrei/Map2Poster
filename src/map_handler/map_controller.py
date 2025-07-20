from flask import Flask, request, send_file
import map_fetcher
from PIL import ImageColor
from io import BytesIO


app = Flask(__name__)

@app.route("/poster", methods=["GET"])
def get_poster():
    location = request.args.get('location')
    distance = int(request.args.get('distance'))
    map_fetcher.FG_COLOR_HEX = request.args.get("fg_color", "#000000")
    map_fetcher.FG_COLOR_RGB = ImageColor.getrgb(map_fetcher.FG_COLOR_HEX)
    map_fetcher.BG_COLOR_HEX = request.args.get("bg_color", "#FFFFFF")
    map_fetcher.BG_COLOR_RGB = ImageColor.getrgb(map_fetcher.BG_COLOR_HEX)
    print(map_fetcher.FG_COLOR_HEX, map_fetcher.FG_COLOR_RGB, map_fetcher.BG_COLOR_HEX, map_fetcher.BG_COLOR_RGB)
    
    image = map_fetcher.make_poster(location=location, range=distance)
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
    app.run(debug=True, host="0.0.0.0")