package com.jobTracker.hunt.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jobTracker.hunt.entity.JobApplication;
import com.jobTracker.hunt.repository.JobApplicationRepository;

@Service
public class JobApplicationService {
    
    @Autowired
    private JobApplicationRepository repository;

    public List<JobApplication> getAllApplications() {
        return repository.findAll();
    }

    public JobApplication saveApplication(JobApplication application) {
        return repository.save(application);
    }

    public JobApplication updateApplication(String id, JobApplication applicationDetails) {
        JobApplication existing = repository.findById(id).orElseThrow();
        // Manual mapping or use a library like MapStruct
        if (applicationDetails.getRole() != null) existing.setRole(applicationDetails.getRole());
        if (applicationDetails.getCompany() != null) existing.setCompany(applicationDetails.getCompany());
        if (applicationDetails.getStatus() != null) existing.setStatus(applicationDetails.getStatus());
        if (applicationDetails.getStage() != null) existing.setStage(applicationDetails.getStage());
        if (applicationDetails.getDescription() != null) existing.setDescription(applicationDetails.getDescription());
        if (applicationDetails.getNotes() != null) existing.setNotes(applicationDetails.getNotes());
        if (applicationDetails.getAiInsights() != null) existing.setAiInsights(applicationDetails.getAiInsights());
        
        return repository.save(existing);
    }

    public void deleteApplication(String id) {
        repository.deleteById(id);
    }
}