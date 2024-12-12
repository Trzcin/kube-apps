const todos = ["todo 1<div>", "todo2"];
const todoList = document.getElementById("todo-list");
todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.innerHTML = html`<div class="todo"><input type="checkbox" name="todo${i+1}" id="todo${i+1}"><label for="todo${i+1}">${todo}</label></div>`;
    todoList.appendChild(li);
});

// Sanitize variables in tagged template string
export function html(template, ...params) {
    const sanitized = params.reduce((result, param, idx) => {
        const arrayParam = Array.isArray(param) ? param : [param];
        let parsedParam = arrayParam.reduce((acc, p) => {
            if (p == null || p === false) {
                return acc;
            } else if (typeof p === "object" && "__html" in p) {
                return acc + p.toString();
            } else {
                return (
                    acc +
                    p
                        .toString()
                        .replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&#039;")
                );
            }
        }, "");
        return result + parsedParam + template[idx + 1];
    }, template[0]);

    return {
        __html: sanitized,
        toString() {
            return this.__html;
        },
    };
}