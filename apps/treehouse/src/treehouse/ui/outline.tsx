import { objectCall, componentsWith, objectHas } from "../model/hooks";
import { NodeEditor } from "./node/editor";
import { Node } from "../model/mod";

import { Document } from "../com/document";

// import { Tag } from "../com/tag";
import * as React from "react";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { getView } from "@/treehouse/views/views";
import { Path } from "@/treehouse/workbench/path";
import { Workbench } from "@/treehouse/workbench/workbench";

export interface Attrs {
  path: Path;
  workbench: Workbench;
}

export interface State {
  hover: boolean;
  tagPopover?: Popover;
}

interface Popover {
  onkeydown: Function;
  oninput: Function;
}

type OutlineEditorProps = {
  workbench: Workbench;
  path: Path;
  alwaysShowNew?: boolean;
};

export const OutlineEditor: React.FC<OutlineEditorProps> = ({
  workbench,
  path,
  alwaysShowNew,
}) => {
  return React.createElement(
    getView((path?.node?.getAttr("view") as any) || "list"),
    {
      workbench,
      path,
      alwaysShowNew,
    },
  );
};

type OutlineNodeProps = {
  path: Path;
  workbench: Workbench;
};

export const OutlineNode: React.FC<Attrs> = ({ path, workbench }) => {
  let [state, setState] = useState<State>({ hover: false });
  let node: Node | null = path.node;

  if (!node) {
    return null;
  }

  let isRef = false;
  let handleNode = node;
  if (node.refTo) {
    isRef = true;
    node = handleNode.refTo;
  }

  let isCut = false;
  if (workbench.clipboard && workbench.clipboard.op === "cut") {
    if (node && workbench.clipboard.node.id === node.id) {
      isCut = true;
    }
  }

  const expanded = workbench.workspace.getExpanded(path.head, handleNode);
  const placeholder = objectHas(node, "handlePlaceholder")
    ? objectCall(node, "handlePlaceholder")
    : "";

  const hover = (e: SyntheticEvent<HTMLDivElement>) => {
    setState({ ...state, hover: true });
    e.stopPropagation();
  };

  const unhover = (e: SyntheticEvent<HTMLDivElement>) => {
    setState({ ...state, hover: false });
    e.stopPropagation();
  };

  const cancelTagPopover = () => {
    if (state.tagPopover) {
      workbench.closePopover();
      setState({ ...state, tagPopover: undefined });
    }
  };

  const oninput = (e: SyntheticEvent<HTMLInputElement>) => {
    const inputElement = e.target as HTMLInputElement;
    if (state.tagPopover) {
      state.tagPopover.oninput(e);
      if (!inputElement.value.includes("#")) {
        cancelTagPopover();
      }
    } else {
      if (inputElement.value.includes("#")) {
        state.tagPopover = {
          onkeydown: () => {},
          oninput: () => {},
        };
        // Don't love that we're hard depending on Tag
        if (!node) return;
        // TODO Tags
        // Tag.showPopover(
        //   workbench,
        //   path,
        //   node,
        //   (onkeydown: Function, oninput: Function) => {
        //     state.tagPopover = { onkeydown, oninput };
        //   },
        //   cancelTagPopover,
        // );
      }
    }
  };

  const onkeydown = (e: React.KeyboardEvent<Element>) => {
    if (state.tagPopover) {
      if (e.key === "Escape") {
        cancelTagPopover();
        return;
      }
      if (state.tagPopover.onkeydown(e) === false) {
        e.stopPropagation();
        return;
      }
    }
    const anyModifiers = e.shiftKey || e.metaKey || e.altKey || e.ctrlKey;
    const inputElement = e.target as HTMLInputElement;
    switch (e.key) {
      case "ArrowUp":
        if (inputElement.selectionStart !== 0 && !anyModifiers) {
          e.stopPropagation();
        }
        break;
      case "ArrowDown":
        if (
          inputElement.selectionStart !== inputElement.value.length &&
          inputElement.selectionStart !== 0 &&
          !anyModifiers
        ) {
          e.stopPropagation();
        }
        break;
      case "Backspace":
        // cursor at beginning of empty text
        if (inputElement.value === "") {
          e.preventDefault();
          e.stopPropagation();
          if (!node || node.childCount > 0) {
            return;
          }
          workbench.executeCommand("delete", { node, path, event: e });
          return;
        }
        // cursor at beginning of non-empty text
        if (
          inputElement.value !== "" &&
          inputElement.selectionStart === 0 &&
          inputElement.selectionEnd === 0
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (!node || node.childCount > 0) {
            return;
          }

          // TODO: make this work as a command?
          const above = workbench.workspace.findAbove(path);
          if (!above || !above.node) {
            return;
          }
          const oldName = above.node?.name;
          above.node.name = oldName + inputElement.value;
          node?.destroy();
          // m.redraw.sync();
          workbench.focus(above, oldName.length);

          return;
        }
        break;
      case "Enter":
        e.preventDefault();
        if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) return;
        // cursor at end of text
        if (inputElement.selectionStart === inputElement.value.length) {
          if (
            (!node || node.childCount > 0) &&
            workbench.workspace.getExpanded(path.head, node)
          ) {
            workbench.executeCommand("insert-child", { node, path }, "", 0);
          } else {
            workbench.executeCommand("insert", { node, path });
          }
          e.stopPropagation();
          return;
        }
        // cursor at beginning of text
        if (inputElement.selectionStart === 0) {
          workbench.executeCommand("insert-before", { node, path });
          e.stopPropagation();
          return;
        }
        // cursor in middle of text
        if (
          inputElement.selectionStart &&
          inputElement.selectionStart > 0 &&
          inputElement.selectionStart < inputElement.value.length
        ) {
          workbench
            .executeCommand(
              "insert",
              { node, path },
              inputElement.value.slice(inputElement.selectionStart),
            )
            .then(() => {
              if (node)
                node.name = inputElement.value.slice(
                  0,
                  inputElement.selectionStart as number,
                );
            });
          e.stopPropagation();
          return;
        }
        break;
    }
  };

  const open = (e: SyntheticEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    workbench.executeCommand("zoom", { node, path });

    // Clear text selection that happens after from double click
    // TODO state management (global)
    // if (document.selection && document.selection.empty) {
    //   document.selection.empty();
    // } else if (window.getSelection) {
    //   window.getSelection().removeAllRanges();
    // }
  };

  const toggle = (e: SyntheticEvent<HTMLDivElement>) => {
    // TODO: hook or something so to not hardcode
    if (node && node.hasComponent(Document)) {
      open(e);
      return;
    }
    if (expanded) {
      workbench.executeCommand("collapse", { node: handleNode, path });
    } else {
      workbench.executeCommand("expand", { node: handleNode, path });
    }
    e.stopPropagation();
  };

  const subCount = (n: any) => {
    return n.childCount + n.getLinked("Fields").length;
  };

  const showHandle = () => {
    if ((node && node.id === workbench.context?.node?.id) || state.hover) {
      return true;
    }
    if (node && node.name.length > 0) return true;
    if (placeholder.length > 0) return true;
  };

  return (
    <div
      onMouseOver={hover}
      onMouseOut={unhover}
      id={`node-${path.id}-${handleNode.id}`}
      className={isCut ? "cut-node" : ""}
    >
      <div className="node-row-outer-wrapper flex flex-row items-start">
        <svg
          className="node-menu shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          onClick={(e: React.MouseEvent<SVGSVGElement>) =>
            workbench.showMenu(e, { node: handleNode, path })
          }
          onContextMenu={(e) =>
            workbench.showMenu(e, { node: handleNode, path })
          }
          data-menu="node"
          viewBox="0 0 16 16"
        >
          {state.hover && (
            <path
              style={{ transform: "translateY(-1px)" }}
              fill="currentColor"
              fill-rule="evenodd"
              d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
            />
          )}
        </svg>
        <div
          className="node-handle shrink-0"
          onClick={toggle}
          onDoubleClick={open}
          onContextMenu={(e) =>
            workbench.showMenu(e, { node: handleNode, path })
          }
          data-menu="node"
          style={{ display: showHandle() ? "block" : "none" }}
        >
          {objectHas(node, "handleIcon") ? (
            objectCall(node, "handleIcon", subCount(node) > 0 && !expanded)
          ) : (
            <svg
              className="node-bullet"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              {subCount(node) > 0 && !expanded ? (
                <circle id="node-collapsed-handle" cx="8" cy="8" r="8" />
              ) : null}
              <circle cx="8" cy="8" r="3" fill="currentColor" />,
              {isRef ? (
                <circle
                  id="node-reference-handle"
                  cx="8"
                  cy="8"
                  r="7"
                  fill="none"
                  stroke-width="1"
                  stroke="currentColor"
                  stroke-dasharray="3,3"
                />
              ) : null}
            </svg>
          )}
        </div>
        {node && node?.raw.Rel === "Fields" ? (
          <div className="flex grow flex-row items-start">
            <div>
              <NodeEditor
                workbench={workbench}
                path={path}
                onkeydown={onkeydown}
                oninput={oninput}
              />
            </div>
            <NodeEditor
              editValue={true}
              workbench={workbench}
              path={path}
              onkeydown={onkeydown}
              oninput={oninput}
            />
          </div>
        ) : (
          <div
            className="flex grow flex-row items-start"
            style={{ gap: "0.5rem" }}
          >
            {objectHas(node, "beforeEditor") &&
              componentsWith(node, "beforeEditor").map((component) =>
                React.createElement(component.beforeEditor(), {
                  node,
                  component,
                }),
              )}
            <NodeEditor
              workbench={workbench}
              path={path}
              onkeydown={onkeydown}
              oninput={oninput}
              placeholder={placeholder}
            />
            {objectHas(node, "afterEditor") &&
              componentsWith(node, "afterEditor").map((component) =>
                React.createElement(component.afterEditor(), {
                  node,
                  component,
                }),
              )}
          </div>
        )}
      </div>
      {objectHas(node, "belowEditor") &&
        componentsWith(node, "belowEditor").map((component) =>
          React.createElement(component.belowEditor(), {
            node,
            component,
            expanded,
          }),
        )}
      {expanded && (
        <div className="expanded-node flex flex-row">
          <div className="indent flex" onClick={toggle}></div>
          <div className="view grow">
            {node &&
              React.createElement(
                getView((node.getAttr("view") as unknown as any) || "list"),
                {
                  workbench,
                  path,
                },
              )}
          </div>
        </div>
      )}
    </div>
  );
};
