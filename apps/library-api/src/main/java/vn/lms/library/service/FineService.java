package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.FineCalculator;
import vn.lms.library.domain.entity.FineEntity;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.enums.FineStatus;
import vn.lms.library.repository.FineRepository;
import vn.lms.library.web.BusinessException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FineService {

    private final FineRepository fineRepository;
    private final LibraryConfigService configService;

    public FineService(FineRepository fineRepository, LibraryConfigService configService) {
        this.fineRepository = fineRepository;
        this.configService = configService;
    }

    @Transactional
    public void createOverdueFineIfNeeded(LoanEntity loan, Instant returnAt) {
        int amount = FineCalculator.calculateOverdueFine(
                loan.getDueAt(), returnAt, configService.getSnapshot().finePerDay());
        if (amount <= 0) {
            return;
        }
        FineEntity fine = new FineEntity();
        fine.setLoan(loan);
        fine.setAmount(amount);
        fine.setStatus(FineStatus.UNPAID);
        fineRepository.save(fine);
    }

    public List<FineEntity> listUnpaid() {
        return fineRepository.findByStatus(FineStatus.UNPAID);
    }

    public List<FineEntity> listUnpaidForMember(UUID memberId) {
        return fineRepository.findByStatusAndLoan_Member_Id(FineStatus.UNPAID, memberId);
    }

    @Transactional
    public FineEntity markPaid(UUID fineId) {
        FineEntity fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khoản phạt."));
        if (fine.getStatus() == FineStatus.PAID) {
            throw new BusinessException("Khoản phạt đã được thanh toán.");
        }
        fine.setStatus(FineStatus.PAID);
        fine.setPaidAt(Instant.now());
        return fineRepository.save(fine);
    }
}
