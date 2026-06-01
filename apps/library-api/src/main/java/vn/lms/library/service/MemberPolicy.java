package vn.lms.library.service;

import org.springframework.stereotype.Component;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.web.BusinessException;

@Component
public class MemberPolicy {

    public void assertCanBorrow(MemberEntity member) {
        if (member.getStatus() == MemberStatus.SUSPENDED) {
            throw new BusinessException("Độc giả đang bị tạm khóa, không thể mượn sách.");
        }
    }
}
