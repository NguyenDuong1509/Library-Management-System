package vn.lms.library;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReportingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void dashboardKpis_returnsAllFields() throws Exception {
        mockMvc.perform(get("/api/reports/dashboard-kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkoutsToday").exists())
                .andExpect(jsonPath("$.pendingReservations").exists())
                .andExpect(jsonPath("$.overdueCount").exists())
                .andExpect(jsonPath("$.unpaidFineTotal").exists());
    }
}
