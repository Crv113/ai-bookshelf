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
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Setter;
import lombok.AccessLevel;

@Data
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Category {

    @Id
    @GeneratedValue
    private UUID id;

    @NotBlank
    private String name;

    @CreatedDate
    @Setter(AccessLevel.NONE)
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
