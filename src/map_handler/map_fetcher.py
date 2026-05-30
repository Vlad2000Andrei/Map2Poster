import osmnx as ox
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageColor
import io
import builtins


def print(*args, **kwargs):
    try:
        builtins.print(*args, **kwargs)
    except OSError:
        pass

FIG_HEIGHT = 18
FIG_WIDTH = 18
ROAD_DISTANCE_PADDING = 2
PAGE_WIDTH = 2100
PAGE_HEIGHT = 2970

BLACK = ("#000000", (0, 0, 0))
WHITE = ("#FFFFFF", (255, 255, 255))


def plt_to_pil(fig, bg_color_hex: str = "#FFFFFF") -> Image:
    buf = io.BytesIO()
    fig.savefig(buf, format='png', facecolor=bg_color_hex, edgecolor='none')
    buf.seek(0)
    im = Image.open(buf)
    im.load()
    buf.close()
    return im


def crop_image(im: Image, scale_factor: float) -> Image:
    width, height = im.size
    width_to_crop = width * (1 - scale_factor)
    height_to_crop = height * (1 - scale_factor)
    (left, upper, right, lower) = (
        width_to_crop // 2,
        height_to_crop // 2,
        width - (width_to_crop // 2),
        height - (height_to_crop // 2)
    )
    crop_box = (left, upper, right, lower)
    print(f"Cropping to: {crop_box}")
    return im.crop(crop_box)


def paste_on_page(im: Image, bg_color_rgb: tuple = (255, 255, 255)) -> Image:
    page = Image.new('RGB', (PAGE_WIDTH, PAGE_HEIGHT), bg_color_rgb)
    pad = (PAGE_WIDTH - im.size[0]) // 2
    page.paste(im, (pad, int(pad * 1.25)))
    return page


def add_centered_text(text: str, height: int, im: Image, font_size: int = 24, font_weight: int = 1, fg_color_rgb: tuple = (0, 0, 0)):
    draw = ImageDraw.Draw(im)
    draw.text(xy=(int(PAGE_WIDTH // 2), height),
              text=text,
              anchor="mm",
              fill=fg_color_rgb,
              stroke_width=int(font_weight),
              font_size=font_size)


def make_poster(location: str = None, range: float = None, bg_color_hex: str = "#FFFFFF", fg_color_hex: str = "#000000") -> Image:
    if location is None:
        location = input("Choose a place name: ")
    coords = ox.geocode(location)

    if range is None:
        range = float(input("Radius of included roads in meters: "))
    REQUEST_RANGE = range * ROAD_DISTANCE_PADDING

    bg_color_rgb = ImageColor.getrgb(bg_color_hex)
    fg_color_rgb = ImageColor.getrgb(fg_color_hex)

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
                            bgcolor=bg_color_hex,
                            edge_color=fg_color_hex)
    fig.set_frameon(True)
    fig.patch.set_visible(True)
    fig.patch.set_facecolor(bg_color_hex)

    image = plt_to_pil(fig, bg_color_hex)
    plt.close(fig)
    image = crop_image(image, 1 / ROAD_DISTANCE_PADDING)
    page = paste_on_page(image, bg_color_rgb)
    add_centered_text(location.upper(),
                      image.size[1] + 400,
                      page,
                      100,
                      font_weight=3,
                      fg_color_rgb=fg_color_rgb)

    add_centered_text(str(coords),
                      image.size[1] + 550,
                      page,
                      50,
                      font_weight=0.5,
                      fg_color_rgb=fg_color_rgb)

    return page


if __name__ == "__main__":
    make_poster().show()

