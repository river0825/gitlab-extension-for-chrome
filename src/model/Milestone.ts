declare class Milestone {
    createdAt: Date
    description: string 
    dueDate: Date
    groupId: number 
    id: number 
    iid: number 
    startDate: Date
    state: "active" | string
    title: string
    updatedAt: Date
    webUrl: string
}

export default Milestone