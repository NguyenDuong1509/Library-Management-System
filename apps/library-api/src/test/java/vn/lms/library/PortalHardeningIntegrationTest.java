package vn.lms.library;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.repository.AuditLogRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.security.UserPrincipal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortalHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    private UsernamePasswordAuthenticationToken adminAuth() {
        UserEntity admin = userRepository.findByEmail("admin@lms.vn").orElseThrow();
        UserPrincipal principal = new UserPrincipal(admin);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @WithMockUser(roles = "MEMBER")
    void search_forbiddenForMember() throws Exception {
        mockMvc.perform(get("/api/search").param("q", "TV"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void search_rejectsShortQuery() throws Exception {
        mockMvc.perform(get("/api/search").param("q", "a"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void search_okForStaff() throws Exception {
        mockMvc.perform(get("/api/search").param("q", "TV"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCreateUser_returns201() throws Exception {
        String email = "portal-test-" + System.nanoTime() + "@lms.vn";
        mockMvc.perform(post("/api/admin/users")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "testpass123",
                                  "name": "Portal Test",
                                  "role": "LIBRARIAN"
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminDeactivateViaActivePatch() throws Exception {
        String email = "deact-" + System.nanoTime() + "@lms.vn";
        mockMvc.perform(post("/api/admin/users")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "testpass123",
                                  "name": "To Deactivate",
                                  "role": "LIBRARIAN"
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated());

        var userId = userRepository.findByEmail(email).orElseThrow().getId();

        mockMvc.perform(patch("/api/admin/users/" + userId + "/active")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"active\": false }"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void configUpdate_writesAuditLog() throws Exception {
        mockMvc.perform(put("/api/admin/config")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maxLoanCount": 5,
                                  "loanDaysDefault": 14,
                                  "maxRenewals": 2,
                                  "finePerDay": 5000,
                                  "reminderDaysBefore": 2
                                }
                                """))
                .andExpect(status().isOk());

        assertThat(auditLogRepository.existsByAction("CONFIG_UPDATE")).isTrue();
    }
}
