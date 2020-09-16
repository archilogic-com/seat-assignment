import _ from 'lodash'

export interface IUser {
    id: number,
    firstName: string,
    lastName: string,
    photoUrl: string
}

export interface IUserElement extends IUser {
    isDragging: boolean,
    isLoading: boolean
}

export interface IDeskAssignment {
    userId?: number,
    deskId: string
}

export interface IUserService {
    getAll: Function,
    findById: Function
}

const users: Array<IUser> = [
    {
        "id": 1,
        "firstName": "Jorge",
        "lastName": "Sierra",
        "photoUrl": "https://i.pravatar.cc/300?img=59"
    },
    {
        "id": 2,
        "firstName": "Martin",
        "lastName": "Daguerre",
        "photoUrl": "https://i.pravatar.cc/300?img=18"
    },
    {
        "id": 3,
        "firstName": "Pablo",
        "lastName": "Gancharov",
        "photoUrl": "https://i.pravatar.cc/300?img=15"
    },
    {
        "id": 4,
        "firstName": "Julio",
        "lastName": "Saráchaga",
        "photoUrl": "https://i.pravatar.cc/300?img=69"
    }
]

const getAll = (): Array<IUserElement> => {
    return users.map((user) => {
        return _.assign(user, {
            isDragging: false,
            isLoading: false
        })
    })
}

const findById = (id: number): IUser | undefined => {
    return _.find(users, (user) => {
        return user.id === id
    })
}

const UserService: IUserService = {
    getAll: getAll,
    findById: findById
}

export default UserService




