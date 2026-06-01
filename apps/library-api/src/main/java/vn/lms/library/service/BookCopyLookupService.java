package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.repository.BookCopyRepository;

import java.util.UUID;

@Service
public class BookCopyLookupService {

    private final BookCopyRepository copyRepository;

    public BookCopyLookupService(BookCopyRepository copyRepository) {
        this.copyRepository = copyRepository;
    }

    public BookCopyLookupResult lookup(String copyCode) {
        BookCopyEntity copy = copyRepository.findByCopyCode(copyCode.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy bản sao."));

        return new BookCopyLookupResult(
                copy.getId(),
                copy.getCopyCode(),
                copy.getStatus().name(),
                copy.getBook().getTitle(),
                copy.getBook().getId());
    }

    public record BookCopyLookupResult(
            UUID id,
            String copyCode,
            String status,
            String bookTitle,
            UUID bookId) {
    }
}
