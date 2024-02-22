import { bindingSymbols } from "../action/keybinds";
import { Workbench } from "@/treehouse/workbench/workbench";
import { Command } from "@/treehouse/action/commands";
import { Context } from "@/treehouse/workbench/mod";
import { MenuItem } from "@/treehouse/action/menus";
import { SyntheticEvent } from "react";

function isDisabled(
  workbench: Workbench,
  item: MenuItem,
  cmd: Command,
  ctx: Context,
) {
  if (cmd) {
    return item.disabled || !workbench.canExecuteCommand(cmd.id, ctx);
  }
  return item.disabled;
}

export const Menu = ({
  workbench,
  items,
  commands,
  ctx,
}: {
  workbench: Workbench;
  items: any[];
  commands: Command[];
  ctx: Context;
}) => {
  const onclick = (item: MenuItem, cmd: Command) => (e: SyntheticEvent) => {
    e.stopPropagation();
    if (isDisabled(workbench, item, cmd, ctx)) {
      return;
    }
    workbench.closeMenu();
    if (item.onclick) {
      item.onclick();
    }
    if (cmd) {
      workbench.executeCommand(cmd.id, ctx);
    }
  };

  return (
    <ul
      className="menu"
      style={{
        margin: "0",
        display: "inline-block",
      }}
    >
      {items
        .filter((i) => !i.when || i.when())
        .map((i) => {
          let title = "";
          let binding = undefined;
          let cmd: Command | undefined = undefined;

          if (i.command) {
            cmd = commands.find((c) => c.id === i.command);
            if (!cmd) return null;
            binding = workbench.keybindings.getBinding(cmd.id);
            title = cmd.title || "";
          }
          if (i.title) {
            title = i.title();
          }
          if (!cmd) return null;

          return (
            <li
              key={cmd.id}
              onClick={() => onclick(i, cmd as Command)}
              className={isDisabled(workbench, i, cmd, ctx) ? "disabled" : ""}
              style={{
                display: "flex",
              }}
            >
              <div>{title}</div>
              {binding && (
                <div className="keybindings grow text-right">
                  {bindingSymbols(binding.key).join(" ").toUpperCase()}
                </div>
              )}
            </li>
          );
        })}
    </ul>
  );
};

/* <li style={liStyle}><div>Indent</div><div style={shortcutStyle}>shift+A</div></li>
<li style={liStyle}><div>Open in new panel</div><div style={shortcutStyle}>shift+meta+Backspace</div></li>
<hr style={{marginLeft: "0.5rem", marginRight: "0.5rem" }} />
<li style={liStyle}>Show list view</li>
<li style={liStyle}>Move</li>
<li style={liStyle}>Delete node</li>
<hr style={{marginLeft: "0.5rem", marginRight: "0.5rem" }} /> */
