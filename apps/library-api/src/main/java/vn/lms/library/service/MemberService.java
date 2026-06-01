package vn.lms.library.service;

import org.springframework.data.domain.Page;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.web.BusinessException;
import vn.lms.library.web.ConflictException;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;
import vn.lms.library.web.dto.RegisterMemberRequest;

import java.util.List;
import java.util.UUID;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public MemberService(
            MemberRepository memberRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<MemberEntity> list() {
        return memberRepository.findAllWithUser();
    }

    @Transactional(readOnly = true)
    public List<MemberEntity> list(String q) {
        return memberRepository.searchList(normalize(q));
    }

    @Transactional(readOnly = true)
    public PageResponse<MemberEntity> listPaged(String q, PageRequest page) {
        Page<MemberEntity> result = memberRepository.searchPaged(
                normalize(q),
                org.springframework.data.domain.PageRequest.of(page.page(), page.size()));
        return PageResponse.from(result, m -> m);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public MemberEntity create(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy user."));
        if (memberRepository.findByUser_Id(userId).isPresent()) {
            throw new ConflictException("User đã có hồ sơ độc giả.");
        }
        return saveNewMember(user, null);
    }

    @Transactional
    public MemberEntity register(RegisterMemberRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email đã tồn tại.");
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setName(request.name().trim());
        user.setRole(UserRole.MEMBER);
        UserEntity savedUser = userRepository.save(user);

        return saveNewMember(savedUser, request.phone());
    }

    @Transactional
    public MemberEntity updateStatus(UUID memberId, MemberStatus status) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy độc giả."));
        member.setStatus(status);
        memberRepository.save(member);
        return memberRepository.findByIdWithUser(memberId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy độc giả."));
    }

    public MemberEntity requireByUserId(UUID userId) {
        return memberRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ độc giả."));
    }

    private MemberEntity saveNewMember(UserEntity user, String phone) {
        MemberEntity member = new MemberEntity();
        member.setUser(user);
        member.setLibraryCardId(generateCardId());
        member.setPhone(phone);
        member.setStatus(MemberStatus.ACTIVE);
        return memberRepository.save(member);
    }

    private String generateCardId() {
        String cardId;
        do {
            cardId = "TV-" + System.currentTimeMillis() % 1_000_000;
        } while (memberRepository.existsByLibraryCardId(cardId));
        return cardId;
    }
}
