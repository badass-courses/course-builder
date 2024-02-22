import { NewNode } from "../ui/node/new";
import { OutlineNode } from "../ui/outline";
import { SmartNode } from "../com/smartnode";
import { Workbench } from "@/treehouse/workbench/workbench";
import { Path } from "@/treehouse/workbench/path";

interface ListViewProps {
  workbench: Workbench;
  path: Path;
  alwaysShowNew?: boolean;
}

const ListView: React.FC<ListViewProps> = ({
  workbench,
  path,
  alwaysShowNew,
}) => {
  let node = path.node;
  if (path.node.refTo) {
    node = path.node.refTo;
  }
  let showNew = false;
  if (
    (node.childCount === 0 && node.getLinked("Fields").length === 0) ||
    alwaysShowNew
  ) {
    showNew = true;
  }
  // TODO: find some way to not hardcode this rule
  if (node.hasComponent(SmartNode)) {
    showNew = false;
  }

  return (
    <div className="list-view">
      <div className="fields">
        {node.getLinked("Fields").length > 0 &&
          node
            .getLinked("Fields")
            .map((n: any) => (
              <OutlineNode
                key={n.id}
                workbench={workbench}
                path={path.append(n)}
              />
            ))}
      </div>
      <div className="children">
        {node.childCount > 0 &&
          node.children.map((n: any) => (
            <OutlineNode
              key={n.id}
              workbench={workbench}
              path={path.append(n)}
            />
          ))}
        {showNew && <NewNode workbench={workbench} path={path} />}
      </div>
    </div>
  );
};

export default ListView;
