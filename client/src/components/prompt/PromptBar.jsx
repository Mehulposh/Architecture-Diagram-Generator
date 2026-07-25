import PromptInput from "./PromptInput";
import StyleSelector from "./StyleSelector";
import GenerateButton from "./GenerateButton";
import PromptError from "./PromptError";

export default function PromptBar() {
  return (
    <form className="flex flex-col gap-2 border-b border-blueprint-line/30 bg-blueprint-900/80 px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="spec-plate text-blueprint-line">
          01 / describe
        </span>

        <PromptInput />

        <StyleSelector />

        <GenerateButton />
      </div>

      <PromptError />
    </form>
  );
}