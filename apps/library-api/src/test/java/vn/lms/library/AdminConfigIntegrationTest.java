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

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private UsernamePasswordAuthenticationToken adminAuth() {
        UserEntity admin = userRepository.findByEmail("admin@lms.vn").orElseThrow();
        UserPrincipal principal = new UserPrincipal(admin);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanReadAndUpdateConfig() throws Exception {
        mockMvc.perform(get("/api/admin/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxLoanCount").value(5));

        mockMvc.perform(put("/api/admin/config")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maxLoanCount": 6,
                                  "loanDaysDefault": 14,
                                  "maxRenewals": 2,
                                  "finePerDay": 5000,
                                  "reminderDaysBefore": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxLoanCount").value(6));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void librarianForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/config"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminRejectsInvalidConfig() throws Exception {
        long auditBefore = auditLogRepository.countByAction("CONFIG_UPDATE");

        mockMvc.perform(put("/api/admin/config")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maxLoanCount": 0,
                                  "loanDaysDefault": 14,
                                  "maxRenewals": 2,
                                  "finePerDay": 5000,
                                  "reminderDaysBefore": 2
                                }
                                """))
                .andExpect(status().isBadRequest());

        assertThat(auditLogRepository.countByAction("CONFIG_UPDATE")).isEqualTo(auditBefore);
    }
}
