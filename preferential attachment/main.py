import networkx as nx
import matplotlib.pyplot as plt
import random
import pandas as pd

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
            target_degrees = dict(graph.degree())
            non_edges = list(nx.non_edges(graph))
            source = None
            target = None

            while (source, target) not in non_edges:
                weights = [x+1 for x in target_degrees.values()]
                source, target = random.choices(list(target_degrees.keys()), weights, k=2)

            graph.add_edge(source, target)
            aux += 1

        result += aux

    return result/SAMPLES


def main():
    result = generate_connected_graph(VERTICES)
    print(result)
    
if __name__ == '__main__':
    main()
