package com.jobTracker.hunt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jobTracker.hunt.entity.JobApplication;


@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, String> {
    // Custom queries can be added here if needed
}