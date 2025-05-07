package com.example.demo.test.controller;

import com.example.demo.test.vo.ResultVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;

@Controller
@Slf4j
public class GisController {

    /** 인덱스 페이지 진입 **/
    @GetMapping("")
    public String index() {
        log.info("index page 진입");
        return "index";
    }

    /** 지도 정보 조회 **/
    @PostMapping("/selectMap")
    @ResponseBody
    public ResultVO selectMap() {
        log.info("CisController [selectMap] called");

        ResultVO vo = new ResultVO();

        HashMap<String, Object> map = new HashMap<>();
        map.put("map", "s");

        vo.setSuccess(true);
        vo.setResult(map);

        return vo;

    }
}