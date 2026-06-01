package vn.lms.library.web.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.service.MemberService;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;
import vn.lms.library.web.dto.RegisterMemberRequest;
import vn.lms.library.web.dto.UpdateMemberStatusRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/members")
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        if (page != null) {
            var result = memberService.listPaged(q, PageRequest.of(page, size));
            return ResponseEntity.ok(new PageResponse<>(
                    result.content().stream().map(MemberResponse::from).toList(),
                    result.totalElements(),
                    result.totalPages(),
                    result.page(),
                    result.size()));
        }
        List<MemberEntity> members = q != null && !q.isBlank()
                ? memberService.list(q)
                : memberService.list();
        return ResponseEntity.ok(members.stream().map(MemberResponse::from).toList());
    }

    @PostMapping
    public MemberResponse create(@RequestBody CreateMemberRequest request) {
        return MemberResponse.from(memberService.create(request.userId()));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse register(@Valid @RequestBody RegisterMemberRequest request) {
        return MemberResponse.from(memberService.register(request));
    }

    @PatchMapping("/{id}/status")
    public MemberResponse updateStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateMemberStatusRequest request) {
        return MemberResponse.from(memberService.updateStatus(id, request.status()));
    }

    public record CreateMemberRequest(UUID userId) {
    }

    public record MemberResponse(
            UUID id,
            String libraryCardId,
            String name,
            String email,
            String status) {

        static MemberResponse from(MemberEntity m) {
            return new MemberResponse(
                    m.getId(),
                    m.getLibraryCardId(),
                    m.getUser().getName(),
                    m.getUser().getEmail(),
                    m.getStatus().name());
        }
    }
}
