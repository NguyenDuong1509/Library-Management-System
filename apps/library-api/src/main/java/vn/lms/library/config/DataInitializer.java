package vn.lms.library.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedUsers(UserRepository users, MemberRepository members, PasswordEncoder encoder) {
        return args -> {
            if (users.count() > 0) {
                return;
            }
            saveUser(users, encoder, "admin@lms.vn", "admin123", "Trần Văn Admin", UserRole.ADMIN);
            saveUser(users, encoder, "thuthu@lms.vn", "thuthu123", "Nguyễn Thị Lan", UserRole.LIBRARIAN);
            UserEntity memberUser = saveUser(users, encoder, "docgia@lms.vn", "docgia123", "Lê Minh Anh", UserRole.MEMBER);

            MemberEntity member = new MemberEntity();
            member.setUser(memberUser);
            member.setLibraryCardId("TV-2024-001");
            member.setStatus(MemberStatus.ACTIVE);
            members.save(member);
        };
    }

    private static UserEntity saveUser(
            UserRepository users,
            PasswordEncoder encoder,
            String email,
            String password,
            String name,
            UserRole role) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(password));
        user.setName(name);
        user.setRole(role);
        return users.save(user);
    }
}
