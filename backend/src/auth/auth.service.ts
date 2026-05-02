import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  login(user: User): { token: string; user: Omit<User, 'password'> } {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    const { password: _pw, ...safeUser } = user as User & { password: string };
    return { token, user: safeUser };
  }

  async register(dto: RegisterDto): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const user = await this.usersService.create(dto);
    return this.login(user);
  }
}
