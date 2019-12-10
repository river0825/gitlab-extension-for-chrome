import {Action} from "./Action";
import {Gitlab} from "gitlab";
import Issue from "../../model/issue";
import {dtsTsTsxJsJsxRegex} from "ts-loader/dist/types/constants";

export class MyJobsSrv implements Action {
    addEvent(document: Document) {
        let divAddList = document!.getElementById("js-add-list") as HTMLDivElement;
        let divExp = document.createElement("div") as HTMLDivElement;
        let buttonExp = document.createElement("button", {}) as HTMLButtonElement;
        buttonExp.innerText = "MyJobs";
        buttonExp.id = 'expMyJobs'
        buttonExp.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
        divExp.appendChild(buttonExp)
        divExp.classList.add("dropdown", "prepend-left-10")
        divAddList!.parentElement.insertBefore(divExp, divAddList);
        divExp.addEventListener("click", MyJobsSrv.onClick)
    }

    protected static async onClick(e: MouseEvent) {
        (e.target as HTMLButtonElement).disabled = true;
        let url = new URL(document.baseURI);
        let gitlab = new Gitlab({
            host: url.origin,
            camelize: true
        });

        try {
            await MyJobsSrv.showMyJobs(gitlab);
            (e.target as HTMLButtonElement).disabled = false;
        } catch (err) {
            console.error(err);
            alert("something wrong, see console for details");
        }
    }


    protected static async showMyJobs(gitlab: Gitlab): Promise<Issue[]> {
        return new Promise<Issue[]>(async (resolve, reject) => {
            let gissues = await gitlab.Issues.all({
                state: 'opened',
                assignee_id: window.gon.current_user_id,
                perPage: 100
            }) as Issue[]

            const inProgressLabels = ['flow/Sprint Backlog', 'flow/開發中']
            const inDoneLabels = ['flow/開發完成', 'flow/測試中', 'flow/DONE']
            const status = {InProgress: "I", Done: "D"};

            let tranformedIssues = gissues.map((issue: Issue) => {
                let flow = issue.labels.reduce((previousValue: string, currentValue: any): string => {
                        if (previousValue && previousValue.indexOf("flow") > -1) return previousValue;
                        if (currentValue.indexOf("flow") > -1) return currentValue;
                    }
                    , '');

                let state = '';
                if (inProgressLabels.indexOf(flow) > -1) state = status.InProgress;
                else if (inDoneLabels.indexOf(flow) > -1) state = status.Done;
                return {title: issue.title, labels: issue.labels, flow: flow, state: state, issue: issue}
            }).filter(((value: { title: string; labels: string[]; flow: string; state: string; }, index) => {
                return (value.state !== undefined && value.state !== '');
            })).sort((a, b): number => {
                return a.state > b.state ? 0 : 1;
            });

            console.log("---- in progress ----");

            tranformedIssues.filter((value => {
                return value.state === status.InProgress
            })).forEach((value, index, array) => {
                console.log(value.title + " ==> " + value.flow)
            });

            console.log("---- DONE ----");

            tranformedIssues.filter((value => {
                return value.state === status.Done
            })).forEach((value, index, array) => {
                console.log(value.title + " ==> " + value.flow)
            });

            resolve(gissues);
        })
    }
}