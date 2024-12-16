import osmnx as ox
import matplotlib.pyplot as plt

location = input("Choose a place name: ")
coords = ox.geocode(location)

print(f"Coordinates of {location}: {coords}")
range = float(input("Radius of included roads in meters: "))

print(f"Fetching map data...")
graph = ox.graph_from_point(center_point=coords, dist=range, dist_type='bbox', network_type='drive')
print(f"Graph fetched.")

print(f"Plotting map...")
ox.plot_graph(graph)

print(f"Showing map...")
plt.show()