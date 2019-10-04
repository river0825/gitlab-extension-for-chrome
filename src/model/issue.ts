import Label from "./label";
import User from "./User";
import Link from "./Link";
import Milestone from "./Milestone";
import TaskCompletionStatus from "./TaskCompletionStatus";
import TimeStats from "./TimeStats";

declare class Issue {
  assignee: User
  assignees: User[]
  author: User
  closedAt: string
  closedBy: string
  confidential: boolean
  createdAt: Date
  description: string
  discussionLocked: boolean
  downvotes: number
  dueDate: Date
  hasTasks: boolean
  id: number
  iid: number
  labels: string[]
  links: Link
  mergeRequestsCount: number
  milestone: Milestone
  projectId: number
  project_id: number
  state: 'closed' | 'opened' | string; //string; //"opened"
  subscribed: false
  taskCompletionStatus: TaskCompletionStatus
  timeStats: TimeStats
  title: string
  updatedAt: Date
  upvotes: number
  userNotesCount: number
  webUrl: string
}

export default Issue