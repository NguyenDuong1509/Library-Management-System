package vn.lms.library.web.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.AdminUserService;
import vn.lms.library.web.dto.CreateAdminUserRequest;
import vn.lms.library.web.dto.UpdateUserActiveRequest;
import vn.lms.library.web.dto.UpdateUserRoleRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<AdminUserService.UserView> list() {
        return adminUserService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserService.UserView create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateAdminUserRequest request) {
        return adminUserService.create(principal.getId(), request);
    }

    @PatchMapping("/{id}/active")
    public AdminUserService.UserView setActive(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserActiveRequest request) {
        return adminUserService.setActive(principal.getId(), id, request.active());
    }

    @PatchMapping("/{id}/deactivate")
    public AdminUserService.UserView deactivate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID id) {
        return adminUserService.deactivate(principal.getId(), id);
    }

    @PatchMapping("/{id}/role")
    public AdminUserService.UserView updateRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return adminUserService.updateRole(principal.getId(), id, request);
    }
}
