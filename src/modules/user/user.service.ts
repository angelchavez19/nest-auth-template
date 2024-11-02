import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  users = [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
    { id: 3, name: 'User 3' },
  ];

  getAllUsers() {
    return this.users;
  }

  getInfoUser(id: number) {
    return this.users.filter((user) => id === user.id);
  }
}
