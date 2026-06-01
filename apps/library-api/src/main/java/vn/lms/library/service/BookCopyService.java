package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.enums.CopyStatus;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.web.BusinessException;
import vn.lms.library.web.ConflictException;

import java.util.List;
import java.util.UUID;

@Service
public class BookCopyService {

    private final BookCopyRepository copyRepository;

    public BookCopyService(BookCopyRepository copyRepository) {
        this.copyRepository = copyRepository;
    }

    @Transactional(readOnly = true)
    public List<CopyView> listByBook(UUID bookId) {
        return copyRepository.findByBookId(bookId).stream().map(this::toView).toList();
    }

    @Transactional
    public CopyView updateStatus(UUID copyId, CopyStatus newStatus) {
        BookCopyEntity copy = copyRepository.findById(copyId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bản sao."));
        if (copy.getStatus() == CopyStatus.ON_LOAN && newStatus != CopyStatus.ON_LOAN) {
            throw new ConflictException("Không thể đổi trạng thái bản sao đang cho mượn.");
        }
        copy.setStatus(newStatus);
        return toView(copyRepository.save(copy));
    }

    private CopyView toView(BookCopyEntity copy) {
        return new CopyView(
                copy.getId(),
                copy.getCopyCode(),
                copy.getStatus().name(),
                copy.getBook().getId(),
                copy.getBook().getTitle());
    }

    public record CopyView(UUID id, String copyCode, String status, UUID bookId, String bookTitle) {
    }
}
