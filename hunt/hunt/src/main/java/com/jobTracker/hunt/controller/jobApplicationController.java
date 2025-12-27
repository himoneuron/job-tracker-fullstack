package com.jobTracker.hunt.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobTracker.hunt.entity.JobApplication;
import com.jobTracker.hunt.service.JobApplicationService;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*") // Allow frontend to connect
public class jobApplicationController {

    @Autowired
    private JobApplicationService service;

    @GetMapping
    public List<JobApplication> getAll() {
        return service.getAllApplications();
    }

    @PostMapping
    public JobApplication create(@RequestBody JobApplication application) {
        return service.saveApplication(application);
    }

    @PutMapping("/{id}")
    public JobApplication update(@PathVariable String id, @RequestBody JobApplication application) {
        return service.updateApplication(id, application);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.deleteApplication(id);
    }
}