const TAFFY = require( 'taffy' );

export interface IUser {
    id: number,
    firstName: string,
    lastName: string,
    photoUrl?: string,
    deskId?: string
}

export interface IDb {
   all: () => ReadonlyArray<IUser>
   insert: (data: Array<IUser>) => void,
   updateRow: (id: number, data: Object) => void
} 

const userDb = TAFFY([]);
userDb.store('users')

const all = (): ReadonlyArray<IUser> => {
    return userDb().get()
}

const insert = (data: Array<IUser>) => {
    userDb.insert(data)
}

const updateRow = (id: number, data: Object) => {
    userDb({id}).update(data)
}

// seed users
if (all().length === 0) {
    insert([
        {   
            "id": 1,
            "firstName": "Jorge",
            "lastName": "Sierra",
            "photoUrl": "https://media-exp1.licdn.com/dms/image/C5622AQGv_4ANX6IH8w/feedshare-shrink_800/0?e=1585785600&v=beta&t=Dj_nKv7ltsLAWKXRZRxWrceLovflrf7Ql08o2t5nwlw",
            "deskId": ''
        },
        {   
            "id": 2,
            "firstName": "Martin",
            "lastName": "Daguerre",
            "photoUrl": "https://www.lagarsoft.com/img/martin_800x800.jpeg",
            "deskId": ''
        },
        {   
            "id": 3,
            "firstName": "Pablo",
            "lastName": "Gancharov",
            "photoUrl": "https://www.lagarsoft.com/img/pablo_800x800.jpeg",
            "deskId": ''
        },
        {   
            "id": 4,
            "firstName": "Julio",
            "lastName": "Sarachaga",
            "photoUrl": "https://www.lagarsoft.com/img/julio_800x800.jpeg",
            "deskId": ''
        }
    ]);
}

export const UserDb: IDb = {
    all: all,
    insert: insert,
    updateRow: updateRow
}
    

    
