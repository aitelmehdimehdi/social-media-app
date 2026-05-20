import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('No account found with this email');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.usersService.setResetCode(user.id, code, expiry);
    await this.mailService.sendResetCode(email, code);

    return { message: 'Code envoyé à votre email' };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('No account found with this email');

    if (!user.resetCode || !user.resetCodeExpiry) {
      throw new BadRequestException('No reset code requested — request a new one');
    }
    if (user.resetCode !== code) {
      throw new BadRequestException('Invalid code');
    }
    if (new Date() > user.resetCodeExpiry) {
      throw new BadRequestException('Code has expired — request a new one');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.clearResetCode(user.id, hashed);

    return { message: 'Password reset successfully' };
  }
}
