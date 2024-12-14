type Todo = {
	id: string;
	userId: string;
	content: string;
	checked?: boolean;
};

type TodoPost = Omit<Todo, 'id' | 'checked'>;
