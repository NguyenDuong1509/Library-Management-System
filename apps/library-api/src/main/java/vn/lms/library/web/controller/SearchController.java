package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.service.SearchService;
import vn.lms.library.web.BusinessException;

@RestController
@RequestMapping("/api/search")
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchService.SearchResult search(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        if (q == null || q.trim().length() < 2) {
            throw new BusinessException("Từ khóa tìm kiếm phải có ít nhất 2 ký tự.");
        }
        return searchService.search(q, limit);
    }
}
