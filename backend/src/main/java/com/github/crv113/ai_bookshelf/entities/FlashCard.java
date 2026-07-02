package com.github.crv113.ai_bookshelf.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class FlashCard {

    @Id
    @GeneratedValue
    private UUID id;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @NotBlank
    private String title;
    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String summary;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Category category;
}
