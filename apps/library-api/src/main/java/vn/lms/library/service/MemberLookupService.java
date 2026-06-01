package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.enums.LoanStatus;
import vn.lms.library.repository.LoanRepository;
import vn.lms.library.repository.MemberRepository;

import java.util.UUID;

@Service
public class MemberLookupService {

    private final MemberRepository memberRepository;
    private final LoanRepository loanRepository;
    private final LibraryConfigService configService;

    public MemberLookupService(
            MemberRepository memberRepository,
            LoanRepository loanRepository,
            LibraryConfigService configService) {
        this.memberRepository = memberRepository;
        this.loanRepository = loanRepository;
        this.configService = configService;
    }

    @Transactional(readOnly = true)
    public MemberLookupResult lookup(String query) {
        MemberEntity member = memberRepository.findByLibraryCardId(query)
                .or(() -> memberRepository.findByUser_EmailIgnoreCase(query.trim()))
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy độc giả."));

        long activeLoanCount = loanRepository.countByMemberIdAndStatus(member.getId(), LoanStatus.ACTIVE);
        int maxLoanCount = configService.getSnapshot().maxLoanCount();

        return new MemberLookupResult(
                member.getId(),
                member.getLibraryCardId(),
                member.getUser().getName(),
                member.getStatus().name(),
                (int) activeLoanCount,
                maxLoanCount);
    }

    public record MemberLookupResult(
            UUID id,
            String libraryCardId,
            String name,
            String status,
            int activeLoanCount,
            int maxLoanCount) {
    }
}
