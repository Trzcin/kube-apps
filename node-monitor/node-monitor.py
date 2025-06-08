import asyncio
import random
from kubernetes import client, config
from os import environ

# Configuration
PING_COUNT = 500  # Number of ping packets to send
PING_TIMEOUT = 1  # Timeout in seconds for each ping
LABEL = 'kubetest-available'
MONITOR_INTERVAL = 5  # Interval (in seconds) between checks

DELAY_THRESHOLD_MS = int(environ["DELAY_THRESHOLD_MS"])
PACKET_LOSS_THRESHOLD = int(environ["PACKET_LOSS_THRESHOLD"])

POD_NAMESPACE = "default"


def get_nodes() -> list[client.V1Node]:
    """Fetch the list of nodes in the cluster."""
    v1 = client.CoreV1Api()
    return v1.list_node().items


def get_current_node_name() -> str:
    """Get the the name of the node this script is running on"""
    return environ["K8S_NODE"]


async def ping_node(node_ip: str):
    """
    Measure packet loss to a node using the `ping` command.
    Returns the packet loss percentage (e.g., 5.0 for 5% loss).
    """
    try:
        # Run the ping command
        process = await asyncio.create_subprocess_exec("ping", "-c", str(PING_COUNT), "-i", str(MONITOR_INTERVAL / PING_COUNT), "-W", str(PING_TIMEOUT), node_ip, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)

        (stdout_data, stderr_data) = await process.communicate()

        time_sum = 0.0
        received = 0.0

        # Extract packet loss from the ping output
        for line in stdout_data.decode("utf-8").splitlines():
            if "time=" in line:
                received += 1
                time_sum += float(line.split("time=")
                                  [1].split("ms")[0].strip())

            if "packet loss" in line:
                loss_percentage = float(
                    line.split(",")[2].split("%")[0].strip())
                return loss_percentage, time_sum / received
    except Exception as e:
        print(f"Error pinging {node_ip}: {e}")
        return 100.0, 0.0  # Default to 100% loss if an error occurs

    return 100.0, 0.0  # Default to 100% loss if parsing fails


def update_node_label(node_name: str, current_node_name: str, available: bool):
    """Update the `kubetest-available` label on a node."""

    v1 = client.CoreV1Api()
    node_available_label = f"{LABEL}-{current_node_name}"

    body = {
        "metadata": {
            "labels": {
                node_available_label: str(available)
            }
        }
    }
    try:
        v1.patch_node(node_name, body)
        print(f"Updated node {node_name} with {node_available_label}={available}")
    except client.exceptions.ApiException as e:
        print(f"Failed to update node {node_name}: {e}")


def taint_node_no_execute(node_name: str, noExecute: bool):
    """Update taints on node."""

    v1 = client.CoreV1Api()

    taints = []

    if noExecute:
        taints.append(client.V1Taint(
            key="kubetest-unavailable",
            value=None,
            effect="NoExecute"
        ))

    body = {
        "spec": {
            "taints": [t.to_dict() for t in taints]
        }
    }

    try:
        v1.patch_node(node_name, body)
        if noExecute:
            print(f"Added NoExecute taint to node {node_name}")
        else:
            print(f"Removed NoExecute taint from node {node_name}")
    except client.exceptions.ApiException as e:
        if noExecute:
            print(f"Failed to add NoExecute taint to node {node_name}: {e}")
        else:
            print(f"Failed to remove NoExecute taint from node {node_name}: {e}")


async def monitor_node(node: client.V1Node, current_node_name: str):
    node_name: str = node.metadata.name
    # Fetch the node's internal IP
    internal_ip: str | None = None
    for address in node.status.addresses:
        if address.type == "InternalIP":
            internal_ip = address.address
            break

    if not internal_ip:
        print(f"No InternalIP found for node {node_name}, skipping...")
        return

    # Measure packet loss
    packet_loss, delay = await ping_node(internal_ip)
    print(f"Pinged node {node_name}({internal_ip}): packet_loss={packet_loss} delay={delay}")

    if delay > DELAY_THRESHOLD_MS or packet_loss > PACKET_LOSS_THRESHOLD:
        print(f"Node {node_name} reached delay or packet-loss threshold")

        # Update the node's label
        update_node_label(node_name, current_node_name, available=False)
    else:
        update_node_label(node_name, current_node_name, available=True)


async def monitor_nodes():
    """
    Monitor all nodes in the cluster and update their labels.
    """
    print("Starting packet loss monitoring...")
    while True:
        current_node_name = get_current_node_name()
        nodes = filter(lambda n: n.metadata.name != current_node_name, get_nodes())
        await asyncio.gather(*[monitor_node(node, current_node_name) for node in nodes])


def bron_kerbosh_algorithm(R: set[int], P: set[int], X: set[int], graph: dict[int, list[int]]):
    if not P and not X:
        yield R

    while P:
        v = P.pop()
        yield from bron_kerbosh_algorithm(
            R.union({v}),
            P.intersection(graph[v]),
            P.intersection(graph[v]),
            graph
        )
        X.add(v)

async def monitor_node_graph():
    await asyncio.sleep(random.uniform(1, 6))
    while True:
        nodes = get_nodes()
        nodes.sort(key=lambda node: node.metadata.name)

        graph = {i: set() for i in range(len(nodes))}
        for i in range(len(nodes)):
            node_i_name = nodes[i].metadata.name
            for j in range(len(nodes)):
                if nodes[j].metadata.labels[f"{LABEL}-{node_i_name}"] == 'True':
                    graph[i].add(j)

        cliques = list(bron_kerbosh_algorithm(set(), set(), set(), graph))

        max_clique = max(cliques, key=lambda c: len(c), default=None)

        if max_clique:
            for i in range(len(nodes)):
                taint_node_no_execute(nodes[i].metadata.name, i not in max_clique)

        await asyncio.sleep(random.uniform(4, 6))


if __name__ == "__main__":
    # Load Kubernetes configuration
    config.load_incluster_config()  # Assumes the script runs on the control plane

    asyncio.run(monitor_nodes())
