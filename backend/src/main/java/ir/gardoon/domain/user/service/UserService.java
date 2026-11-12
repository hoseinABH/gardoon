package ir.gardoon.domain.user.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.common.util.IranianBankingUtil;
import ir.gardoon.domain.user.dto.UpdateBankingRequest;
import ir.gardoon.domain.user.dto.UserProfileDto;
import ir.gardoon.domain.user.entity.User;
import ir.gardoon.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getEntity(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "کاربر یافت نشد"));
    }

    @Transactional(readOnly = true)
    public User getEntityByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "کاربری با این شماره موبایل در گردون ثبت‌نام نکرده است"));
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(UUID userId) {
        return UserProfileDto.from(getEntity(userId));
    }

    @Transactional
    public UserProfileDto updateBanking(UUID userId, UpdateBankingRequest request) {
        String cleanCard = request.defaultCardNumber().replaceAll("[^0-9]", "");
        if (!IranianBankingUtil.isValidCardNumber(cleanCard)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CARD", "شماره کارت ۱۶ رقمی معتبر نیست");
        }

        String cleanSheba = request.defaultIban().trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (!IranianBankingUtil.isValidSheba(cleanSheba)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SHEBA", "شماره شبا معتبر نیست");
        }

        String resolvedBank = (request.defaultBankName() != null && !request.defaultBankName().isBlank())
            ? request.defaultBankName().trim()
            : IranianBankingUtil.getBankNameByBin(cleanCard);

        User user = getEntity(userId);
        user.setDefaultCardNumber(cleanCard);
        user.setDefaultIban(cleanSheba);
        user.setDefaultBankName(resolvedBank);
        user.setDefaultAccountHolder(request.defaultAccountHolder().trim());
        if (user.getFullName().startsWith("کاربر ")) {
            user.setFullName(request.defaultAccountHolder().trim());
        }

        return UserProfileDto.from(userRepository.save(user));
    }
}
