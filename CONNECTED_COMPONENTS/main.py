import networkx as nx
import matplotlib.pyplot as plt
import random
import pandas as pd

#VERTICES = [pow(2, x) for x in range(1, 16)]
VERTICES = 10
PATH = "./CONNECTED_COMPONENTS/results.csv"
SAMPLES = 30

def draw_graph(graph):
    nx.draw(graph, with_labels=True, font_weight='bold')
    plt.show()

def generate_connected_graph(vertices):
    result = 0
    graph = nx.Graph()
    graph.add_nodes_from(range(vertices))
    for _ in range(SAMPLES):
        graph = nx.create_empty_copy(graph)
        aux = 0
        while(not nx.is_connected(graph)):
            non_edges = list(nx.non_edges(graph)) 
            chosen_edge = random.choice(non_edges)
            graph.add_edge(chosen_edge[0], chosen_edge[1])
            aux += 1
        
        # print(f"Sample {i} / Edges {aux}")
        result += aux
    
    # draw_graph(graph)
    return result/SAMPLES

def generate_graph_distribution():
    df = pd.read_csv(PATH)
    plt.scatter(df['Number_edges'], df['Number_vertices'])
    plt.show()


def main():
    file = open(PATH, "a")
    file.write("Number_vertices,Number_edges")
    vertices = VERTICES
    #for vertices in VERTICES:
    result = generate_connected_graph(vertices)
    print(f"Vertices {vertices} / Edges {result:.2f}")
    file.write(f"\n{vertices},{result:.2f}")

    #generate_graph_distribution()
    
if __name__ == '__main__':
    main()
