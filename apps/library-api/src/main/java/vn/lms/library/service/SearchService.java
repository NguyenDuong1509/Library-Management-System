package vn.lms.library.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.repository.MemberRepository;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SearchService {

    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final BookCopyRepository copyRepository;

    public SearchService(
            BookRepository bookRepository,
            MemberRepository memberRepository,
            BookCopyRepository copyRepository) {
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.copyRepository = copyRepository;
    }

    public SearchResult search(String q, int limit) {
        int capped = Math.min(Math.max(limit, 1), 20);
        var pageable = PageRequest.of(0, capped);
        String term = q == null ? "" : q.trim();
        if (term.isEmpty()) {
            return new SearchResult(List.of(), List.of(), List.of());
        }

        List<BookHit> books = bookRepository.searchGlobal(term, pageable).stream()
                .map(this::toBookHit)
                .toList();
        List<MemberHit> members = memberRepository.searchGlobal(term, pageable).stream()
                .map(this::toMemberHit)
                .toList();
        List<CopyHit> copies = copyRepository.searchGlobal(term, pageable).stream()
                .map(this::toCopyHit)
                .toList();
        return new SearchResult(books, members, copies);
    }

    private BookHit toBookHit(BookEntity b) {
        return new BookHit(b.getId(), b.getSlug(), b.getTitle(), b.getAuthors(), b.getCategory());
    }

    private MemberHit toMemberHit(MemberEntity m) {
        return new MemberHit(m.getId(), m.getLibraryCardId(), m.getUser().getName(), m.getUser().getEmail());
    }

    private CopyHit toCopyHit(BookCopyEntity c) {
        return new CopyHit(
                c.getId(),
                c.getCopyCode(),
                c.getStatus().name(),
                c.getBook().getId(),
                c.getBook().getSlug(),
                c.getBook().getTitle());
    }

    public record SearchResult(List<BookHit> books, List<MemberHit> members, List<CopyHit> copies) {
    }

    public record BookHit(
            java.util.UUID id, String slug, String title, String authors, String category) {
    }

    public record MemberHit(java.util.UUID id, String libraryCardId, String name, String email) {
    }

    public record CopyHit(
            java.util.UUID id,
            String copyCode,
            String status,
            java.util.UUID bookId,
            String bookSlug,
            String bookTitle) {
    }
}
