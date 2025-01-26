package main

import (
	"context"
	"fmt"
	"os"
	"strconv"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/component-base/cli"
	"k8s.io/kubernetes/cmd/kube-scheduler/app"
	"k8s.io/kubernetes/pkg/scheduler/framework"
)

const PluginName = "PacketLossScheduler"

type PacketLossPlugin struct {
	handle framework.Handle
}

func New(_ context.Context, _ runtime.Object, handle framework.Handle) (framework.Plugin, error) {
	return &PacketLossPlugin{handle: handle}, nil
}

func (p *PacketLossPlugin) Name() string {
	return PluginName
}

// Score calculates the score for a given node based on its packet loss
func (p *PacketLossPlugin) Score(ctx context.Context, state *framework.CycleState, pod *v1.Pod, nodeName string) (int64, *framework.Status) {
	nodeInfo, err := p.handle.SnapshotSharedLister().NodeInfos().Get(nodeName)
	if err != nil {
		return 0, framework.NewStatus(framework.Error, fmt.Sprintf("failed to get node info: %v", err))
	}

	// Get packet-loss label from the node
	node := nodeInfo.Node()
	packetLossLabel, exists := node.Labels["packet-loss"]
	if !exists {
		// Assign a default score for nodes without packet loss information
		return 100, framework.NewStatus(framework.Success)
	}

	// Convert packet loss to a numeric value
	packetLoss, err := strconv.ParseFloat(packetLossLabel, 64)
	if err != nil {
		return 0, framework.NewStatus(framework.Error, fmt.Sprintf("invalid packet-loss value: %v", err))
	}

	// Invert the packet loss to calculate the score (lower loss = higher score)
	// Example: max score = 100, normalize the packet loss
	const maxScore = 100
	score := maxScore - int64(packetLoss*10) // Scale packet loss appropriately
	if score < 0 {
		score = 0
	}

	return score, framework.NewStatus(framework.Success)
}

func (p *PacketLossPlugin) ScoreExtensions() framework.ScoreExtensions {
	return nil
}

// Register the plugin
func main() {
	command := app.NewSchedulerCommand(
		app.WithPlugin(PluginName, New),
	)
	code := cli.Run(command)
	os.Exit(code)
}
