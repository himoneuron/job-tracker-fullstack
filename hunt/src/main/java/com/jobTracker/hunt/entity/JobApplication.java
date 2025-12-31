package com.jobTracker.hunt.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "job_applications")
@Data
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String role;
    private String company;
    private String location;
    private String link;
    private String status; // Applied, Not Applied, etc.
    private String stage;  // Screening, Technical, etc.
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String aiInsights;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    private String salary;
    private String dateApplied;
    private LocalDateTime createdAt = LocalDateTime.now();
}
