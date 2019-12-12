import {Action} from "./Action";

export class MREnlarge implements Action {
    addEvent(document: Document) {
        let el = document.getElementsByClassName("js-target-branch") as HTMLCollectionOf<Element>;
        if (el.length === 0) return;

        (el[0] as HTMLLinkElement).style.fontSize = "20px";
        (el[0] as HTMLLinkElement).style.color = "red";
    }
}
