import { bindingSymbols } from "../action/keybinds";
import { Picker, type State } from "./picker";
import { Workbench } from "@/treehouse/workbench/workbench";
import { Command } from "@/treehouse/action/commands";

type CommandPaletteProps = {
  workbench: Workbench;
  ctx: any;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  workbench,
  ctx,
}) => {
  const getTitle = (cmd: Command) => {
    const title = cmd.title || cmd.id;
    return title.replace("-", " ").replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  };
  const sort = (a: Command, b: Command) => {
    return getTitle(a).localeCompare(getTitle(b));
  };
  const onpick = (cmd: Command) => {
    workbench.closeDialog();
    workbench.commands.executeCommand(cmd.id, ctx);
  };
  const onchange = (state: State) => {
    state.items = cmds.filter((cmd) => {
      const value = cmd.title || cmd.id;
      return value.toLowerCase().includes(state.input.toLowerCase());
    });
  };
  const getBindingSymbols = (cmd: Command) => {
    const binding = workbench.keybindings.getBinding(cmd.id);
    return binding ? bindingSymbols(binding.key).join(" ").toUpperCase() : "";
  };

  const cmds = Object.values(workbench.commands.commands)
    .filter((cmd) => !cmd.hidden)
    .filter((cmd) => workbench.canExecuteCommand(cmd.id, ctx))
    .sort(sort);

  return (
    <div className="palette">
      <Picker
        onpick={onpick}
        onchange={onchange}
        inputview={(onkeydown, oninput) => (
          <div>
            <input
              style={{ width: "98%" }}
              type="text"
              onKeyDown={onkeydown}
              onInput={oninput}
              placeholder="Enter command..."
            />
          </div>
        )}
        itemview={(cmd: Command) => (
          <div className="flex">
            <div>{getTitle(cmd)}</div>
            <div className="keybindings grow text-right">
              {getBindingSymbols(cmd)}
            </div>
          </div>
        )}
      />
    </div>
  );
};
