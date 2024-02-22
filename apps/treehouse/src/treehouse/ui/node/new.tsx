import { Workbench } from "@/treehouse/workbench/workbench";
import { Path } from "@/treehouse/workbench/path";

interface NewNodeProps {
  workbench: Workbench;
  path: Path;
}

export const NewNode: React.FC<NewNodeProps> = ({ workbench, path }) => {
  const keydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.stopPropagation();
      e.preventDefault();
      const node = path.node;
      if (node.childCount > 0) {
        const lastchild = node.children[node.childCount - 1];
        workbench.executeCommand("insert-child", { node: lastchild, path });
      }
    } else {
      workbench.executeCommand(
        "insert-child",
        { node: path.node, path },
        e.currentTarget.value,
      );
    }
  };

  return (
    <div className="new-node flex flex-row items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <circle cx="8" cy="7" r="7" />
        <path
          style={{ transform: "translate(0px, -1px)" }}
          d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
        />
      </svg>
      <div className="flex grow">
        <input
          className="grow"
          type="text"
          onKeyDown={keydown}
          defaultValue={""}
        />
      </div>
    </div>
  );
};
