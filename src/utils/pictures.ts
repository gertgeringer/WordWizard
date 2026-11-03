import {open} from "@tauri-apps/api/dialog";
import {TFunction} from "../i18n";

/** Lets the teacher choose an SVG picture, resolves with undefined when cancelled. */
export async function pickSvgPicture(t: TFunction): Promise<string | undefined> {
    const result = await open({
        multiple: false,
        directory: false,
        filters: [{
            name: t("svgPictures"),
            extensions: ["svg"]
        }]
    });
    return typeof result === "string" ? result : undefined;
}
