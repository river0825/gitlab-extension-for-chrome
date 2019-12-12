import {Action} from "./Action";
import {Gitlab} from "gitlab";
import Group from "../../model/group";
import Board from "../../model/board";
import List from "../../model/list";
import Issue from "../../model/issue";
import {camelizeKeys} from 'humps'

export class CloseDeployedSrv implements Action{
    addEvent(document: Document) {
        let divAddList = document!.getElementById("js-add-list") as HTMLDivElement;
        if(!divAddList) return;

        let divExp = document.createElement("div") as HTMLDivElement;
        let buttonToAdd = document.createElement("button", {}) as HTMLButtonElement;
        buttonToAdd.innerText = "Close";
        buttonToAdd.id = 'CloseDeployed'
        buttonToAdd.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
        divExp.appendChild(buttonToAdd)
        divExp.classList.add("dropdown", "prepend-left-10")
        divAddList!.parentElement.insertBefore(divExp, divAddList);
        divExp.addEventListener("click", CloseDeployedSrv.onClick)
    }

    protected static async onClick(e: MouseEvent){
        (e.target as HTMLButtonElement).disabled = true;
        let url = new URL(document.baseURI);

        let gitlab = new Gitlab({
            host: url.origin,
            token: "y9yA8C82nVCyAj8QoW3g",
            camelize: true
        });

        let groupBoard = await CloseDeployedSrv.getGroupListsInBoard(gitlab);

        let listToClose = groupBoard.board.lists.find((l) => {
            return l.label.name == "flow/已部署正式"
        });

        if (listToClose) {
            CloseDeployedSrv.issuesInList(gitlab, groupBoard.board, listToClose, false, (issue, index) => {
                console.log(`Issue to close, issue id: ${issue.iid}`)
                gitlab.Issues.edit(issue.projectId, issue.iid, {state_event: 'close'})
            })
        }
        ;

        (e.target as HTMLButtonElement).disabled = false;
    }

    private static async getGroupListsInBoard(gitlab: Gitlab) {
        let group: Group;
        let groups = await gitlab.Groups.show(document.body.dataset.group);

        if (Array.isArray(groups)) {
            group = groups.find((elm: Group) => {
                return elm.name == document.body.dataset.group
            }) as Group
        } else {
            group = groups as Group
        }

        //let issues: Array<Issue> = [];
        let boards = await gitlab.GroupIssueBoards.all(group.id) as Board[];
        let board = boards[0];

        console.log(`Total lists in board(${board.id}): ${board.lists.length}`)

        return {group: group, board: board};
    }

    private static async issuesInList(gitlab: Gitlab, board: Board, list: List, increasePage: boolean,
                                      callback: (issue: Issue, index: number) => any
    ) {
        let issuesInList: Issue[];
        let page = 0;
        let index = -1;
        do {
            let url = '/-/boards/' + board.id + '/lists/' + list.id + '/issues'
            let query = {id: list.id, scope: 'all', state: 'opened', page: page, perPage: 100};
            let response = await gitlab.Issues.requester.get("issues", url, {query: query})
            issuesInList = JSON.parse(response.body).issues as Issue[];
            issuesInList = camelizeKeys(issuesInList);

            if (!Array.isArray(issuesInList)) {
                break;
            }

            await Promise.all(issuesInList.map(async (issue) => {
                index++;
                return callback(issue, index)
            }));

            if (increasePage) page++;
        } while (issuesInList.length !== 0)

    }
}