import os
from interviewer import Interviewer
from enduser import EndUser
from deployer import Deployer
from analyst import Analyst
from archivist import Archivist
from reviewer import Reviewer

end_user_dialogue_round = 2
deployer_dialogue_round = 1
OUTPUT_DIR = "examples"
os.makedirs(OUTPUT_DIR, exist_ok=True)  # 确保输出目录存在

def save_output(filename: str, content: str):
    with open(os.path.join(OUTPUT_DIR, filename), "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    initial_requirements = "我想写一个博客网站"
    interviewer = Interviewer(initial_requirements)

    # 解析终端用户列表
    end_user_list = interviewer.decide_end_user_list()
    print(end_user_list)

    # 与终端用户对话
    for end_user_name in end_user_list:
        print(f"=====communicate with {end_user_name}======")
        end_user = EndUser(end_user_name)
        for i in range(end_user_dialogue_round):
            question = interviewer.dialogue_with_end_user()
            print(f"Interviewer: {question}")
            end_user.add_to_memory("interview_question", question)
            answer = end_user.dialogue_with_interviewer()
            print(f"{end_user_name}: {answer}")
            interviewer.add_to_memory("end_user_message", answer)

    # 与系统部署人员对话
    print("=====communicate with system deployer======")
    deployer = Deployer()
    for i in range(deployer_dialogue_round):
        question = interviewer.dialogue_with_system_deployer()
        print(f"Interviewer: {question}")
        deployer.add_to_memory("interview_question", question)
        answer = deployer.dialogue_with_interviewer()
        print(f"System Deployer: {answer}")
        interviewer.add_to_memory("deployer_message", answer)

    # 写访谈记录
    print("=====write interview record======")
    interview_record = interviewer.write_interview_record()
    save_output("interview_record.txt", interview_record)
    print(interview_record)

    # 写用户需求
    print("=====write user requirements======")
    user_requirements = interviewer.write_user_requirements()
    save_output("user_requirements.txt", user_requirements)
    print(user_requirements)

    # 写系统需求
    print("=====write system requirements======")
    analyst = Analyst()
    analyst.add_to_memory("operation_environment", interviewer.get_memory("operation_environment"))
    analyst.add_to_memory("user_requirements", user_requirements)
    system_requirements = analyst.write_system_requirements()
    save_output("system_requirements.txt", system_requirements)

    # 构建需求模型
    print("=====construct requirement model======")
    model_text = analyst.construct_requirement_model()
    save_output("requirement_model.puml", model_text)

    # 写SRS
    print("=====write srs======")
    archivist = Archivist()
    archivist.add_to_memory("requirement_model", model_text)
    archivist.add_to_memory("system_requirements", system_requirements)
    srs_text = archivist.write_srs()
    save_output("srs.txt", srs_text)

    # 评估SRS
    print("=====evaluate srs======")
    reviewer = Reviewer()
    reviewer.add_to_memory("srs_draft", srs_text)
    evaluation_report = reviewer.evaluate_srs()
    save_output("srs_evaluation.txt", evaluation_report)

    # 更新SRS
    print("=====update srs======")
    archivist.add_to_memory("review_report", evaluation_report)
    updated_srs = archivist.update_srs()
    save_output("srs_updated.txt", updated_srs)

    print("=====All artifacts saved in 'examples/' directory=====")