import asyncio
from kubernetes import client, config
from os import environ

# Configuration
PING_COUNT = 500  # Number of ping packets to send
PING_TIMEOUT = 1  # Timeout in seconds for each ping
PACKET_LOSS_KEY = "packet-loss"
DELAY_KEY = "delay"
MONITOR_INTERVAL = 5  # Interval (in seconds) between checks

DELAY_THRESHOLD = 100
PACKET_LOSS_THRESHOLD = 3

POD_NAMESPACE = "default"
NODE_NAME_PREFIX = "kubetest"


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


def update_node_label(node_name: str, current_node_name: str, packet_loss: float, delay: float):
    """Update the `packet-loss` and `delay` labels on a node."""

    v1 = client.CoreV1Api()
    node_packet_loss_key = f"{PACKET_LOSS_KEY}-{current_node_name}"
    node_delay_key = f"{DELAY_KEY}-{current_node_name}"

    body = {
        "metadata": {
            "labels": {
                node_packet_loss_key: f"{packet_loss:.1f}",
                node_delay_key: f"{delay:.1f}"
            }
        }
    }
    try:
        v1.patch_node(node_name, body)
        print(f"Updated node {node_name} with {PACKET_LOSS_KEY}={
              packet_loss:.1f} {DELAY_KEY}={delay:.1f}")
    except client.exceptions.ApiException as e:
        print(f"Failed to update node {node_name}: {e}")


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
    # Update the node's label
    update_node_label(node_name, current_node_name, packet_loss, delay)

    if delay > DELAY_THRESHOLD or packet_loss > PACKET_LOSS_THRESHOLD:
        print(f"Node {node_name} reached delay or packet-loss threshold")
        v1 = client.CoreV1Api()

        pods = v1.list_namespaced_pod(POD_NAMESPACE).items

        for pod in pods:
            if pod.spec.node_name == node_name:
                pod_name = pod.metadata.name
                print(f"Deleting pod {pod_name} from node {node_name}")
                v1.delete_namespaced_pod(pod_name, POD_NAMESPACE)


async def monitor_nodes():
    """
    Monitor all nodes in the cluster and update their packet loss labels.
    """
    print("Starting packet loss monitoring...")
    while True:
        current_node_name = get_current_node_name()
        nodes = filter(lambda n: n.metadata.name != current_node_name, get_nodes())
        await asyncio.gather(*[monitor_node(node, current_node_name) for node in nodes])

if __name__ == "__main__":
    # Load Kubernetes configuration
    config.load_kube_config()  # Assumes the script runs on the control plane

    asyncio.run(monitor_nodes())
