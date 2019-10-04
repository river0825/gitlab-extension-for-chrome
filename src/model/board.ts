import List from "./list";
import Project from "./project";

declare class Board{
    id : number
    lists: List[]
    project: Project
}

export default Board