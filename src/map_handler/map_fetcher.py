import osmnx as ox
import pandas as pd
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
import io

FIG_HEIGHT = 18
FIG_WIDTH = 18
ROAD_DISTANCE_PADDING = 2
PAGE_WIDTH = 2100
PAGE_HEIGHT = 2970

BLACK = ("#000000", (0, 0, 0))
WHITE = ("#FFFFFF", (255, 255, 255))

BG_COLOR = WHITE
FG_COLOR = BLACK

BG_COLOR_HEX, BG_COLOR_RGB = BG_COLOR
FG_COLOR_HEX, FG_COLOR_RGB = FG_COLOR


def plt_to_pil() -> Image:
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    im = Image.open(buf)
    return im


def crop_image(im: Image, scale_factor: float) -> Image:
    width, height = im.size
    width_to_crop = width * (1 - scale_factor)
    height_to_crop = height * (1 - scale_factor)
    (left, upper, right, lower) = (
    width_to_crop // 2, height_to_crop // 2, width - (width_to_crop // 2), height - (height_to_crop // 2))
    crop_box = (left, upper, right, lower)
    print(f"Cropping to: {crop_box}")
    return im.crop(crop_box)


def paste_on_page(im: Image) -> Image:
    page = Image.new('RGB', (PAGE_WIDTH, PAGE_HEIGHT), BG_COLOR_RGB)
    pad = (PAGE_WIDTH - im.size[0]) // 2
    page.paste(im, (pad, int(pad * 1.25)))
    return page


def add_centered_text(text: str, height: int, im: Image, font_size: int = 24, font_weight: int = 1):
    draw = ImageDraw.Draw(im)
    draw.text(xy=(int(PAGE_WIDTH // 2), height),
              text=text,
              anchor="mm",
              fill=FG_COLOR_RGB,
              stroke_width=int(font_weight),
              font_size=font_size)


def make_poster(location: str = None, range: str = None) -> Image:
    if location is None:
        location = input("Choose a place name: ")
    coords = ox.geocode(location)

    if range is None:
        range = float(input("Radius of included roads in meters: "))
    REQUEST_RANGE = range * ROAD_DISTANCE_PADDING

    print(f"Fetching map data...")
    graph = ox.graph_from_point(center_point=coords, dist=REQUEST_RANGE, dist_type='bbox', network_type='drive',
                                retain_all=True, truncate_by_edge=True)
    print(f"Graph fetched.")

    nodes, edges = ox.graph_to_gdfs(graph)
    line_weights = pd.to_numeric(edges['lanes'], errors='coerce').fillna(1).to_list()

    print(f"Plotting map...")
    fig, ax = ox.plot_graph(graph,
                            node_size=0,
                            edge_linewidth=line_weights,
                            show=False,
                            figsize=(FIG_HEIGHT * ROAD_DISTANCE_PADDING, FIG_WIDTH * ROAD_DISTANCE_PADDING),
                            bgcolor=BG_COLOR_HEX,
                            edge_color=FG_COLOR_HEX)

    image = plt_to_pil()
    image = crop_image(image, 1 / ROAD_DISTANCE_PADDING)
    page = paste_on_page(image)
    add_centered_text(location.upper(),
                      image.size[1] + 400,
                      page,
                      100,
                      font_weight=3)

    add_centered_text(str(coords),
                      image.size[1] + 550,
                      page,
                      50,
                      font_weight=0.5)

    return page


if __name__ == "__main__":
    make_poster().show()
